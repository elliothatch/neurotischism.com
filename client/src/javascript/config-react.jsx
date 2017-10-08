/*global React*/
/*global ReactDOM*/
/*global io*/
/*global FreshrContext*/
/*global qrcodelib*/

var configSocket = io('/~config');

const srcDirectory = {
	name: 'src',
	path: '/src',
	type: 'directory',
	entries: [
		{
			name: 'sass',
			path: 'src/sass',
			type: 'directory',
			entries: [
				{
					name: 'a.sass',
					path: 'src/javascript/a.sass',
					type: 'file',
					entries: null
				}, {
					name: 'b.sass',
					path: 'src/javascript/b.sass',
					type: 'file',
					entries: null
				}
			]
		}, {
			name: 'javascript',
			path: 'src/javascript',
			type: 'directory',
			entries: [
				{
					name: 'one.js',
					path: 'src/javascript/one.js',
					type: 'file',
					entries: null
				}, {
					name: 'two.js',
					path: 'src/javascript/two.js',
					type: 'file',
					entries: null
				}, {
					name: 'more',
					path: 'src/javascript/more',
					type: 'directory',
					entries: [
						{
							name: 'three.js',
							path: 'src/javascript/more/three.js',
							type: 'file',
							entries: null
						}, {
							name: 'four.js',
							path: 'src/javascript/more/four.js',
							type: 'file',
							entries: null
						}
					]
				}
			]
		}
	]
};

/*
 * entry:
 *   name{string}
 *   path{string}
 *   type{'file' | 'directory'}
 *   entries{entry[]}
 */
class FileExplorer extends React.Component {
	constructor(props) {
		super(props);

		this.handleChangeDirectory = this.handleChangeDirectory.bind(this);
		this.handleSelectionChange = this.handleSelectionChange.bind(this);

		this.state = {
			selectedEntry: null,
			currentPath: [props.entry]
		};
	}

	handleChangeDirectory(entry) {
		var entryIndex = this.state.currentPath.findIndex((e) => e === entry);
		this.setState({
			currentPath: this.state.currentPath.slice(0, entryIndex+1)
		});
	}
	handleSelectionChange(entry) {
		if(this.state.selectedEntry === entry) {
			if(this.state.selectedEntry.type === 'directory') {
				this.setState({
					currentPath: this.state.currentPath.concat(this.state.selectedEntry)
				});
			}
		}
		else {
			this.setState({
				selectedEntry: entry
			});
		}
	}

	render() {
		return <div className="file-explorer">
			<div>File Explorer</div>
			<FileExplorerPath path={this.state.currentPath} onChangeDirectory={this.handleChangeDirectory}></FileExplorerPath>
			<ul className="entries">
				{this.state.currentPath.length > 0 && this.state.currentPath[this.state.currentPath.length-1].entries.map(
					(e) => <FileExplorerEntry key={e.path} entry={e} onSelectionChange={this.handleSelectionChange} selected={this.state.selectedEntry === e}></FileExplorerEntry>)
				}
			</ul>
		</div>;
	}
}

class FileExplorerPath extends React.Component {
	constructor(props) {
		super(props);
		this.handleClickUpDirectory = this.handleClickUpDirectory.bind(this);
		this.handleClickDirectory = this.handleClickDirectory.bind(this);
	}

	handleClickUpDirectory(e, data) {
		if(this.props.path.length > 1) {
			this.props.onChangeDirectory(this.props.path[this.props.path.length-2]);
		}
	}
	handleClickDirectory(entry) {
		this.props.onChangeDirectory(entry);
	}
	render() {
		return <div className="path">
			<button className="up-directory-button" disabled={this.props.path.length <= 1} onClick={this.handleClickUpDirectory}>Up</button>
			<ul className="directories">
				{this.props.path.map((e) => <FileExplorerPathEntry key={e.path} entry={e} onClickDirectory={this.handleClickDirectory} />)}
			</ul>
		</div>;
	}
}

class FileExplorerPathEntry extends React.Component {
	constructor(props) {
		super(props);
		this.handleClick= this.handleClick.bind(this);
	}

	handleClick(e, data) {
		this.props.onClickDirectory(this.props.entry);
	}
	render() {
		return <li><button onClick={this.handleClick}>{this.props.entry.name}</button></li>;
	}
}

class FileExplorerEntry extends  React.Component {
	constructor(props) {
		super(props);
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick(e, data) {
		this.props.onSelectionChange(this.props.entry);
	}

	render() {
		return <li><div className={`card${this.props.selected ? ' selected' : ''}`} onClick={this.handleClick}>{this.props.entry.name}</div></li>;
	}
}

class TaskLogDisplay extends React.Component {
	render() {
		return <div className="log-display">
			{this.props.task && this.props.task.logs &&
			<ul className="logs">
				{this.props.task.logs.map((l,i) => <li key={i}>{l.message}</li>)}
			</ul>}
		</div>;
	}
}

class Task extends React.Component {
	constructor(props) {
		super(props);
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick(e, data) {
		this.props.onSelectionChange(this.props.task);
	}

	render() {
		return <div className="task">
			<div
				className={`card${this.props.task.status === 1 ? ' success' : ''}${this.props.task.status === 2 ? ' warn' : ''}${this.props.task.status === 3 ? ' error' : ''}`}
				onClick={this.handleClick}>
				<span className={`${this.props.task.running ? 'loader' : ''}`}></span>
				<span className="status">{this.props.task.status}</span>
				<span className="name">{this.props.task.name}</span>
			</div>
			{this.props.task.tasks.length > 0 &&
					<ul className="tasks">
						{this.props.task.tasks.map((t,i) => <li key={i}><Task task={t} onSelectionChange={this.props.onSelectionChange} /></li>)}
					</ul>
			}
		</div>;
	}
}

class TaskDisplay extends React.Component {
	constructor(props) {
		super(props);
		this.state = {selectedTask: null};
		this.handleSelectionChange = this.handleSelectionChange.bind(this);
	}

	handleSelectionChange(data) {
		this.setState({
			selectedTask: data
		});
	}

	render() {
		return <div className="task-display">
			<div className="task-col">
				<Task task={this.props.task} onSelectionChange={this.handleSelectionChange}></Task>
			</div>
			<TaskLogDisplay task={this.state.selectedTask}></TaskLogDisplay>
		</div>;
	}
}

class QRComponent extends React.Component {
	constructor(props) {
		super(props);
		this.state = {dataUrl: null};
	}

	componentWillMount() {
		this.generateQrCode(this.props.text);
	}

	componentWillReceiveProps(nextProps) {
		if(nextProps.text !== this.props.text) {
			this.generateQrCode(nextProps.text);
		}
	}

	generateQrCode(text) {
		if(text) {
			qrcodelib.toDataURL(text, {}, (err, url) => {
				if(err) {
					console.error('QRComponent', err);
				}
				else {
					this.setState({dataUrl: url});
				}
			});
		}
	}

	render() {
		return <div>
			{this.state.dataUrl && <img src={this.state.dataUrl} />}
		</div>;
	}
}

class ConfigComponent extends React.Component {

	handleClickBuild(event) {
		configSocket.emit('build');
	}

	render() {
		return <div>
			<header>
				<h1 className="title">Freshr Configuration</h1>
			</header>
			<div className="page-content">
				<div className="file-explorer-display">
					<FileExplorer entry={this.props.srcDirectory}></FileExplorer>
				</div>
				<div className="ip-display">
					{[{name: 'Local URL', ip: this.props.config.serverLocalIp}, {name: 'Public URL', ip: this.props.config.serverPublicIp}].map(ipObj => {
						var url = ipObj.ip && 'http://' + ipObj.ip + ':' + this.props.config.serverPort;
						return <div key={ipObj.name}>
							<span>{ipObj.name}: {ipObj.ip ? url : 'unknown'}</span>
							<QRComponent text={url} />
						</div>;
					})}
				</div>
				<div className="build-display">
					<button onClick={this.handleClickBuild}>Build</button>
					{this.props.buildTask && <TaskDisplay task={this.props.buildTask} />}
					{this.props.config.categories.map(category => {
						return <div key={category.name} className="config card collapser-wrapper">
							<h2 className="card-title">{category.name} <button className="collapser"></button></h2>
							<div className="card-body collapser-target">
								<ul className="fields">
									{category.fields.map(field => {
										return <li key={field.name}>{field.name}</li>;
									})}
								</ul>
							</div>
						</div>;
					})}
				</div>
			</div>
		</div>;
	}
}

function getTask(task, taskPath) {
	if(taskPath.length === 0) {
		return task;
	}
	return getTask(task.tasks[taskPath[0]], taskPath.slice(1));
}

var buildTasks = {};

configSocket.on('build/start', function(tasks) {
	console.log('build/start', tasks);
	buildTasks = tasks;
	render();
});
configSocket.on('build/success', function(result) {
	console.log('build/success', result);
});
configSocket.on('build/fail', function(error) {
	console.log('build/fail', error);
});
configSocket.on('build/task/start', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.running = true;
	render();
});
configSocket.on('build/task/log', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.status = data.status;
	if(!task.logs) {
		task.logs = [];
	}
	task.logs.push(data.log);
	render();
});
configSocket.on('build/task/done', function(data) {
	var task = getTask(buildTasks.tasks, data.path);
	task.running = false;
	task.status = data.status;
	render();
});

configSocket.on('publicip', function(ip) {
	FreshrContext.config.serverPublicIp = ip;
	render();
});

configSocket.emit('build');
configSocket.emit('publicip');

render();

function render() {
	const element = <ConfigComponent config={FreshrContext.config} buildTask={buildTasks.tasks} srcDirectory={srcDirectory} />;
	ReactDOM.render(
		element,
		document.getElementById('root')
	);
}


